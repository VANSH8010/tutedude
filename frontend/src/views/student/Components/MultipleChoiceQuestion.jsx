import React, { useEffect, useState } from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useNavigate, useParams } from 'react-router';
import axiosInstance from '../../../axios';
import { toast } from 'react-toastify';

export default function MultipleChoiceQuestion({ questions, saveUserTestScore }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState(new Map());
  const navigate = useNavigate();
  const { examId } = useParams();

  const [isLastQuestion, setIsLastQuestion] = useState(false);

  useEffect(() => {
    if (questions.length > 0) {
      setIsLastQuestion(currentQuestion === questions.length - 1);
    }
  }, [currentQuestion, questions.length]);

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handleNextQuestion = async () => {
    const currentQuestionData = questions[currentQuestion];
    if (!currentQuestionData) return;

    let isCorrect = false;

    if (currentQuestionData?.options?.length > 0) {
      const correctOption = currentQuestionData.options.find((opt) => opt.isCorrect);
      if (correctOption && selectedOption) {
        isCorrect = correctOption._id === selectedOption;
      }
    }

    // Save answer
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      newAnswers.set(currentQuestionData._id, selectedOption);
      return newAnswers;
    });

    if (isCorrect) {
      setScore(score + 1);
      if (saveUserTestScore) saveUserTestScore();
    }

    // If last question, submit test
    if (isLastQuestion) {
      try {
        const answersObject = Object.fromEntries(answers);
        if (selectedOption) {
          answersObject[currentQuestionData._id] = selectedOption;
        }

        await axiosInstance.post(
          '/api/users/results',
          {
            examId,
            answers: answersObject,
          },
          { withCredentials: true }
        );

        navigate(`/exam/${examId}/codedetails`);
      } catch (error) {
        console.error('Error saving results:', error);
        toast.error('Failed to save results');
      }
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
    }
  };

  if (!questions || questions.length === 0) {
    return <Typography>Loading questions...</Typography>;
  }

  const currentQ = questions[currentQuestion];

  return (
    <Card style={{ width: '50%', margin: 'auto', marginTop: '20px' }}>
      <CardContent style={{ padding: '20px' }}>
        <Typography variant="h5" mb={3}>
          Question {currentQuestion + 1}:
        </Typography>

        <Typography variant="body1" mb={3}>
          {currentQ?.question || 'No Question Available'}
        </Typography>

        <Box mb={4}>
          <FormControl component="fieldset">
            <RadioGroup
              aria-label="quiz"
              name="quiz"
              value={selectedOption}
              onChange={handleOptionChange}
            >
              {currentQ?.options?.length > 0 ? (
                currentQ.options.map((option) => (
                  <FormControlLabel
                    key={option._id}
                    value={option._id}
                    control={<Radio />}
                    label={option.optionText}
                  />
                ))
              ) : (
                <Typography>No options available</Typography>
              )}
            </RadioGroup>
          </FormControl>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            onClick={handleNextQuestion}
            disabled={selectedOption === null}
          >
            {isLastQuestion ? 'Submit Test' : 'Next Question'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
