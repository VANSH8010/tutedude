import React, { useEffect } from 'react';
import { Typography } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import CheatingTable from './components/CheatingTable';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

// ✅ Connect to backend socket server
// Local development
const socket = io(process.env.REACT_APP_BACKEND_URL);
// ⚠️ Deployment ke time apne backend ka deployed URL use karo
// Example: const socket = io('https://your-backend.onrender.com');

const ExamLogPage = () => {
  useEffect(() => {
    // 🔔 Listen for cheating events
    socket.on('cheating-event', (data) => {
      toast.warn(
        `🚨 Cheating Alert: ${data.event} (Exam ID: ${data.examId}) at ${new Date(
          data.time
        ).toLocaleTimeString()}`
      );
    });

    // 🔄 Cleanup on unmount to prevent multiple listeners
    return () => {
      socket.off('cheating-event');
    };
  }, []);

  return (
    <PageContainer title="ExamLog Page" description="This is ExamLog page">
      <DashboardCard title="Exam Monitoring Dashboard">
        <Typography variant="h6" gutterBottom>
          Live Proctoring Alerts will appear here as notifications.
        </Typography>
        <CheatingTable />
      </DashboardCard>
    </PageContainer>
  );
};

export default ExamLogPage;
