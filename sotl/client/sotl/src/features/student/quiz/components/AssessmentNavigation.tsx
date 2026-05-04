import React, { Fragment } from 'react';
import Card, { CardOwnProps } from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Box, Typography } from '@mui/material';
import { IAssessmentResult } from '../../../../models/AssessmentResult';
import { AssessmentType, IAssessment } from '../../../../models/Assessment';
import { Student } from '../../../../models/Student';

const AssessmentNavigation: React.FC<{ sx?: CardOwnProps['sx'], assessmentResults?: IAssessmentResult[], currentEvaluateeId: string, handleSwitchPage: Function, isReviewMode: boolean; }> = ({ sx, assessmentResults, currentEvaluateeId, handleSwitchPage, isReviewMode }) => {
  // const sortedAssessmentResults = currentEvaluateeId ? assessmentResults?.sort((a, b) => (a.evaluatee as Student)?._id === currentEvaluateeId ? -1 : 0) : assessmentResults;
  
  return <Card sx={{ p: 3, ...sx }} variant="outlined">
    <Typography sx={{ display: 'inline-block' }} variant="h5" gutterBottom><strong>Questions</strong></Typography>
    {assessmentResults?.map((result) => {
      return <Fragment key={result._id}>
        {(result.assessment as IAssessment).type === AssessmentType.PeerEvaluation && <Typography sx={{ fontWeight: (result.evaluatee as Student)?._id === currentEvaluateeId ? 'bold' : 'normal'}}>{`${(result.evaluatee as Student)?.name} (${(result.evaluatee as Student)?.matricNumber}) ${(result.evaluatee as Student)?._id === currentEvaluateeId ? '[Current]' : ''}:`}</Typography>}
        <CardContent sx={{ display: 'flex', textAlign: 'center', columnGap: 2, rowGap: 2, flexWrap: 'wrap' }}>
          {result.pages?.map((page, i) => {
            return page.responses.map((response) => {
              const disabled = !isReviewMode || (currentEvaluateeId && (result.evaluatee as Student)?._id !== currentEvaluateeId);
              const textColor = response?.completed ? 'white' : 'black';
              const bgColor = response?.completed ? '#2196f3' : 'white';
              const fontWeight = result.currentPage === page.pageNum ? 'bold' : 'normal';
              const borderWidth = result.currentPage === page.pageNum ? 2 : 1;
              const hoverStyle = result.currentPage === page.pageNum ? {} : { color: 'white', bgcolor: 'black', cursor: disabled ? 'not-allowed' : 'pointer' };
              return <Box key={response._id}
                sx={{
                  width: 40, height: 40, borderColor: 'black', borderStyle: 'solid', borderWidth: borderWidth, borderRadius: 1, color: textColor, fontWeight: fontWeight, bgcolor: bgColor, userSelect: 'none', '&:hover': hoverStyle,
                }} onClick={ disabled ? undefined : () => handleSwitchPage(page.pageNum)}>{response?.questionNum}
              </Box>
            })
          })}
        </CardContent>

      </Fragment>
    })
    }

  </Card>;
};

export default AssessmentNavigation;
