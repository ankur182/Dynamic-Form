import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import '../questionform.css'; 

const DynamicForm = () => {
  // State to store questions, retrieved from localStorage on initial load
  const [questions, setQuestions] = useState(() => {
    const savedQuestions = localStorage.getItem('dynamicFormQuestions');
    return savedQuestions ? JSON.parse(savedQuestions) : [];
  });

  // State to handle form submission
  const [submitted, setSubmitted] = useState(false); 

  // Effect to save questions to localStorage whenever questions state changes
  useEffect(() => {
    localStorage.setItem('dynamicFormQuestions', JSON.stringify(questions));
  }, [questions]);

  // Function to add a new question to the form
  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), text: '', type: 'Short Answer', children: [], answer: '' }]);
  };

  // Recursive function to update a specific question by id (supports nested questions)
  const updateQuestion = (id, key, value, parentQuestions = questions) => {
    const updatedQuestions = parentQuestions.map((question) => {
      if (question.id === id) {
        return { ...question, [key]: value };
      }
      if (question.children && question.children.length) {
        return { ...question, children: updateQuestion(id, key, value, question.children) };
      }
      return question;
    });
    return updatedQuestions;
  };

  // Function to handle updates in a question (e.g., question text or type)
  const handleUpdate = (id, key, value) => {
    setQuestions(updateQuestion(id, key, value));
  };

  // Recursive function to add a child question under a specific parent question
  const addChildQuestion = (id, parentQuestions = questions) => {
    const updatedQuestions = parentQuestions.map((question) => {
      if (question.id === id) {
        return {
          ...question,
          children: [...question.children, { id: Date.now(), text: '', type: 'Short Answer', children: [], answer: '' }],
        };
      }
      if (question.children && question.children.length) {
        return { ...question, children: addChildQuestion(id, question.children) };
      }
      return question;
    });
    return updatedQuestions;
  };

  // Handler to add child question when clicking 'Add Sub-question'
  const handleAddChild = (id, e) => {
    e.preventDefault(); 
    setQuestions(addChildQuestion(id));
  };

  // Recursive function to delete a question and its children
  const deleteQuestion = (id, parentQuestions = questions) => {
    return parentQuestions.filter((question) => {
      if (question.id === id) {
        return false;
      }
      if (question.children && question.children.length) {
        question.children = deleteQuestion(id, question.children);
      }
      return true;
    });
  };

  // Handler to delete a question when clicking 'Delete'
  const handleDelete = (id, e) => {
    e.preventDefault(); 
    setQuestions(deleteQuestion(id));
  };

  // Handles the drag-and-drop action when reordering questions
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const reorderedQuestions = Array.from(questions);
    const [movedQuestion] = reorderedQuestions.splice(source.index, 1);
    reorderedQuestions.splice(destination.index, 0, movedQuestion);

    setQuestions(reorderedQuestions);
  };

  // Function to render questions recursively, including children questions
  const renderQuestions = (questions, prefix = '') => {
    return (
      <Droppable droppableId="questions" type="QUESTION">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {questions.map((question, index) => (
              <Draggable key={question.id} draggableId={String(question.id)} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="question-block"
                  >
                    {/* Question input and selection */}
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="font-semibold">{prefix ? `${prefix}.${index + 1}` : `Q${index + 1}`}</span>
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => handleUpdate(question.id, 'text', e.target.value)}
                        placeholder="Enter question"
                        className="border p-2 rounded w-full"
                      />
                      <select
                        value={question.type}
                        onChange={(e) => handleUpdate(question.id, 'type', e.target.value)}
                        className="border p-2 rounded bg-white"
                      >
                        <option value="Short Answer">Short Answer</option>
                        <option value="True/False">True/False</option>
                      </select>

                      {/* Conditional input for True/False answer */}
                      {question.type === 'True/False' && (
                        <select
                          value={question.answer}
                          onChange={(e) => handleUpdate(question.id, 'answer', e.target.value)}
                          className="border p-2 rounded bg-white"
                        >
                          <option value="">Select Answer</option>
                          <option value="True">True</option>
                          <option value="False">False</option>
                        </select>
                      )}

                      {/* Delete and Add Sub-question buttons */}
                      <button onClick={(e) => handleDelete(question.id, e)} className="delete">
                        Delete
                      </button>
                      {question.type === 'True/False' && question.answer === 'True' && (
                        <button onClick={(e) => handleAddChild(question.id, e)} className="add-question">
                          Add Sub-question
                        </button>
                      )}
                    </div>

                    {/* Recursively render child questions */}
                    {question.children.length > 0 && (
                      <div className="ml-8">{renderQuestions(question.children, `${prefix ? `${prefix}.` : ''}${index + 1}`)}</div>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  };

  // Render submitted questions
  const renderSubmittedQuestions = (questions, prefix = '') => {
    return questions.map((question, index) => {
      const currentPrefix = prefix ? `${prefix}.${index + 1}` : `Q${index + 1}`;
      return (
        <div key={question.id} className="submitted-question">
          <div className="font-semibold">
            {currentPrefix}: {question.text} ({question.type})
            {question.type === 'True/False' && ` - Answer: ${question.answer}`}
          </div>
          {question.children.length > 0 && (
            <div className="ml-8">{renderSubmittedQuestions(question.children, currentPrefix)}</div>
          )}
        </div>
      );
    });
  };

  // Handles the form submission, clearing the questions from localStorage
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true); 
    localStorage.removeItem('dynamicFormQuestions'); 
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dynamic Form</h1>
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* If form not submitted, show the form; otherwise, show submitted questions */}
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            {renderQuestions(questions)}
            <div className="mt-6 space-x-4">
              <button
                type="button"
                onClick={addQuestion}
                className="add-question"
              >
                Add New Question
              </button>
              <button
                type="submit"
                className="submit"
              >
                Submit Form
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Submitted Questions</h2>
            {renderSubmittedQuestions(questions)}
          </div>
        )}
      </DragDropContext>
    </div>
  );
};

export default DynamicForm;
