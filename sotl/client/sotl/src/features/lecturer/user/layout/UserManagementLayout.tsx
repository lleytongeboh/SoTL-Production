import React, { Dispatch, SetStateAction } from 'react';
import { useBatchStudent, SET_ERROR_STATUS_FALSE, SET_LOADING_STATUS_FALSE, SET_SUCCESS_STATUS_FALSE, BaseStudentContextProps } from '../contexts/BatchStudentContext';
import { Outlet } from "react-router-dom";
import LoadingPopup from '../../../../components/LoadingPopup';
import ErrorPopup from '../../../../components/ErrorPopup';
import { batchStudentHooks } from '../hooks/batchStudentHooks';
import SuccessPopup from '../../../../components/SuccessPopup';

const UserManagementLayout = () => {
  const { batchStudentDispatch, loading, setLoading, error, setError, success, setSuccess }: BaseStudentContextProps = useBatchStudent();
  const { hookLoading, hookError, getAllBatchStudents } = batchStudentHooks();
  const [isLoading, setIsLoading]: [boolean, Dispatch<SetStateAction<boolean>>] = React.useState<boolean>(true);

  React.useEffect(() => {
    const getBatchStudents = async () => {
      try{
        let result = await getAllBatchStudents();
        batchStudentDispatch({ type: 'INIT', payload: result });
        if(hookError){
          setError({status: true, message: hookError});
        }
      }catch(e: any){
        setError({status: true, message: hookError});
      }finally{
        setIsLoading(false);
        setLoading(SET_LOADING_STATUS_FALSE);
      }
      
    };
    getBatchStudents();
  }, []);

  if (isLoading) {
    return (
      <LoadingPopup open={loading.status} onClose={() => setLoading(SET_LOADING_STATUS_FALSE)} />
    );
  } else {
    return (
      <>
      {(loading.status || hookLoading) && <LoadingPopup open={loading.status} onClose={() => setLoading(SET_LOADING_STATUS_FALSE)} />}
        {error.status && <ErrorPopup content={error.message ?? ''} open={error.status} onClose={() => setError(SET_ERROR_STATUS_FALSE)} />}
        { success.status && <SuccessPopup content={success.message ?? ''} open={success.status} onClose={() => setSuccess(SET_SUCCESS_STATUS_FALSE)} />}
        <Outlet />
      </>
    );
  }

};

export default UserManagementLayout;
