import { IAssessmentResult, IAssessmentResultPage } from '../../../../models/AssessmentResult';
import { API_BASE_URL } from '../../../../configs/sotl-config';
import { standardApi } from '../../../../utils/standardApi';
import { AxiosRequestConfig } from 'axios';
import { IQuiz, RewardType } from '../../../../models/Quiz';
import { AssessmentType, IAssessment } from '../../../../models/Assessment';

const ASSESSMENT_API_BASE_URL = `${API_BASE_URL}/api/assessments`;
const ASSESSMENTRESULT_API_BASE_URL = `${API_BASE_URL}/api/assessmentresults`;

interface AssessmentResultRequestConfig extends AxiosRequestConfig {
  params?: { accessCode?: string, evaluateeId?: string, [key: string]: any };
}

export class AssessmentResultService {
  public readonly clientAccessCode?: string;
  public readonly evaluatorId: string | null; // only for lecturer use to review assessment results based on evaluator
  public evaluateeId?: string;
  constructor(searchParams: URLSearchParams, clientAccessCode?: string, evaluateeId?: string) {
    if (clientAccessCode) {
      this.clientAccessCode = clientAccessCode;
    }
    if (evaluateeId) {
      this.evaluateeId = evaluateeId;
    }
    this.evaluatorId = searchParams.get('evaluatorId');
  }

  public getAssessmentResultRequestConfig() {
    const config: AssessmentResultRequestConfig = { params: {} };
    if (this.clientAccessCode) {
      config.params!.accessCode = this.clientAccessCode;
    }
    if (this.evaluateeId) {
      config.params!.evaluateeId = this.evaluateeId;
    }
    if (this.evaluatorId) {
      config.params!.evaluatorId = this.evaluatorId;
    }
    return config;
  }

  public async getMyAssessmentListCall(batch: string): Promise<any> {
    try {
      const config = this.getAssessmentResultRequestConfig();
      config.params!.batch = batch;
      const response = await standardApi(`${ASSESSMENTRESULT_API_BASE_URL}/mylist`, 'GET', true, undefined, config);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.result;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  public async getAssessmentCall(assessmentId: string): Promise<any> {
    try {
      const response = await standardApi(`${ASSESSMENTRESULT_API_BASE_URL}/${assessmentId}`, 'GET', true, undefined, this.getAssessmentResultRequestConfig());
      if (response.error) {
        throw new Error(response.error);
      }
      return response.result;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  public async startAssessmentCall(assessmentId: string): Promise<any> {
    try {
      const response = await standardApi(`${ASSESSMENTRESULT_API_BASE_URL}/${assessmentId}/start`, 'PUT', true, undefined, this.getAssessmentResultRequestConfig());
      if (response.error) {
        throw new Error(response.error);
      }
      return response.result;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  public async endAssessmentCall(assessmentId: string): Promise<any> {
    try {
      const response = await standardApi(`${ASSESSMENTRESULT_API_BASE_URL}/${assessmentId}/end`, 'PUT', true, undefined, this.getAssessmentResultRequestConfig());
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  public async getAssessmentPageCall(assessmentId: string, pageNum: number, reviewMode?: boolean): Promise<any> {
    try {
      const config = this.getAssessmentResultRequestConfig();
      if (reviewMode) {
        config.params!.reviewMode = true;
      }
      const response = await standardApi(`${ASSESSMENTRESULT_API_BASE_URL}/${assessmentId}/pages/${pageNum}`, 'GET', true, undefined, config);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.result;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  public async saveAssessmentCall(assessmentId: string, assessmentPage: IAssessmentResultPage, goBack?: boolean): Promise<any> {
    try {
      const config = this.getAssessmentResultRequestConfig();
      if (goBack) {
        config.params!.goBack = true;
      }
      const response = await standardApi(`${ASSESSMENTRESULT_API_BASE_URL}/${assessmentId}/pages/${assessmentPage.pageNum}`, 'PUT', true, assessmentPage, config);
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  static rewardValueGetter(result: IAssessmentResult, rewardType: RewardType) {
    if ((result.assessment as IAssessment).isPublicForReview && (result.assessment as IAssessment).type === AssessmentType.SelfAssessment) {
      return result.totalRewards?.[rewardType];
    } else {
      return -1;
    }
  }

  static rewardValueFormatter(value: number | undefined, row: IAssessmentResult, rewardType: RewardType) {
    if (!((row.assessment as IAssessment)?.quiz_assigned as IQuiz)?.rewards?.[rewardType]) {
      return 'Disabled';
    }

    if (isNaN(value as number)) {
      return '-';
    } else if(value === -1) {
      return 'Hidden';
    } else {
      return value;
    }
  }
}