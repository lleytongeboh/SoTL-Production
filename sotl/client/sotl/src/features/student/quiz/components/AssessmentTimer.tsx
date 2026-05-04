import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Box, SxProps, Theme, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { IAssessmentResult } from '../../../../models/AssessmentResult';

export const enGBLocale = 'en-GB';
const timeOptions: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
};

const AssessmentTimer: React.FC<{ assessmentResult?: IAssessmentResult, miniMode?: boolean, sx?: SxProps<Theme> }> = ({ assessmentResult, miniMode, sx = {} }) => {
  const [serverClockOffset, setServerClockOffset] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [now, setNow] = useState(0);

  function handleStart() {
    setNow(Date.now());

    setInterval(() => {
      setNow(Date.now());
    }, 1000);
  }

  let hours = 0, minutes = 0, seconds = 0;
  if (endTime >= now) {
    seconds = (endTime - now) / 1000;
    minutes = seconds / 60;
    hours = ~~(minutes / 60);
    seconds = ~~(seconds % 60);
    minutes = ~~(minutes % 60);
  }

  useEffect(() => {
    handleStart();
  }, []);

  useEffect(() => {
    setEndTime(Date.now() + (assessmentResult?.timeLeft ?? 0));
    if (assessmentResult?.serverClock) {
      setServerClockOffset((new Date(assessmentResult.serverClock)).getTime() - Date.now());
    }
  }, [assessmentResult]);

  const timeLeft = `${hours} : ${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`;

  if (miniMode) {
    return <Box sx={{ borderColor: 'red', borderWidth: 1, p: 1, ...sx }}>Time left {timeLeft}</Box>;
  } else {
    return <Card sx={{ p: 3, ...sx }} variant="outlined">
      <Typography sx={{ display: 'inline-block' }} variant="h5" gutterBottom><b>Clock</b></Typography>
      <CardContent>
        {assessmentResult?.serverClock && <Typography><b>Server:&#32;</b>{(new Date(Date.now() + serverClockOffset)).toLocaleString(enGBLocale, timeOptions)}</Typography>}
        <Typography><b>You:&#32;</b>{(new Date()).toLocaleString(enGBLocale, timeOptions)}</Typography>
        <br />
        <Typography><b>Time Left:</b></Typography>
        <Typography variant="h4">{timeLeft}</Typography>
      </CardContent>
    </Card>;
  }
};

export default AssessmentTimer;
