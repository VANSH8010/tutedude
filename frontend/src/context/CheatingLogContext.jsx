import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const CheatingLogContext = createContext();

export const CheatingLogProvider = ({ children }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const [cheatingLog, setCheatingLog] = useState({
    noFaceCount: 0,
    multipleFaceCount: 0,
    cellPhoneCount: 0,
    prohibitedObjectCount: 0,
    examId: '',
    username: userInfo?.name || '',
    email: userInfo?.email || '',
    screenshots: [], // ✅ new field
    events: [], // ✅ new field
  });

  useEffect(() => {
    if (userInfo) {
      setCheatingLog((prev) => ({
        ...prev,
        username: userInfo.name,
        email: userInfo.email,
      }));
    }
  }, [userInfo]);

  const updateCheatingLog = (newLog) => {
    setCheatingLog((prev) => {
      // Ensure all count fields are numbers and have default values
      const updatedLog = {
        ...prev,
        ...newLog,
        noFaceCount: Number(newLog.noFaceCount || prev.noFaceCount || 0),
        multipleFaceCount: Number(newLog.multipleFaceCount || prev.multipleFaceCount || 0),
        cellPhoneCount: Number(newLog.cellPhoneCount || prev.cellPhoneCount || 0),
        prohibitedObjectCount: Number(
          newLog.prohibitedObjectCount || prev.prohibitedObjectCount || 0,
        ),
        screenshots: [...(prev.screenshots || []), ...(newLog.screenshots || [])],
        events: [...(prev.events || []), ...(newLog.events || [])],
      };
      console.log('Updated cheating log:', updatedLog);
      return updatedLog;
    });
  };

  const resetCheatingLog = (examId) => {
    const resetLog = {
      noFaceCount: 0,
      multipleFaceCount: 0,
      cellPhoneCount: 0,
      prohibitedObjectCount: 0,
      examId: examId,
      username: userInfo?.name || '',
      email: userInfo?.email || '',
      screenshots: [], // ✅ reset screenshots
      events: [], // ✅ reset events
    };
    console.log('Reset cheating log:', resetLog);
    setCheatingLog(resetLog);
  };

  return (
    <CheatingLogContext.Provider value={{ cheatingLog, updateCheatingLog, resetCheatingLog }}>
      {children}
    </CheatingLogContext.Provider>
  );
};

export const useCheatingLog = () => {
  const context = useContext(CheatingLogContext);
  if (!context) {
    throw new Error('useCheatingLog must be used within a CheatingLogProvider');
  }
  return context;
};
