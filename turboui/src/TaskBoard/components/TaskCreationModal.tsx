import React, { useState, useEffect, useRef } from "react";
import { PrimaryButton, SecondaryButton } from "../../Button";
import * as Types from "../types";
import Modal from "../../Modal";
import { IconCalendar, IconUser } from "../../icons";
import { TextField } from "../../TextField";

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: Omit<Types.Task, "id">) => void;
  milestones?: Types.Milestone[];
  currentMilestoneId?: string;
  people?: Types.Person[];
}

export function TaskCreationModal({
  isOpen,
  onClose,
  onCreateTask,
  milestones = [],
  currentMilestoneId,
  people = [],
}: TaskCreationModalProps) {
  // Form state
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [milestoneId, setMilestoneId] = useState<string>("");
  const [createMore, setCreateMore] = useState(false);
  
  // Update milestone ID when currentMilestoneId changes or modal opens
  useEffect(() => {
    if (isOpen) {
      // Handle special case for "no-milestone"
      if (currentMilestoneId === "no-milestone") {
        setMilestoneId("");
      } else if (currentMilestoneId) {
        setMilestoneId(currentMilestoneId);
      } else {
        // When adding from main button, clear milestone selection
        setMilestoneId("");
      }
    }
  }, [isOpen, currentMilestoneId]);
  
  
  // Reset form after task creation
  const resetForm = () => {
    setTitle("");
    setDueDate("");
    setAssigneeId("");
    // Keep the milestone selected for creating multiple tasks in same milestone
    // Keep the createMore toggle state
  };
  
  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit if title is empty
    if (!title.trim()) return;
    
    // Create new task object
    const newTask: Omit<Types.Task, "id"> = {
      title: title.trim(),
      status: "pending",
    };
    
    // Add optional fields if they exist
    if (dueDate) {
      newTask.dueDate = new Date(dueDate);
    }
    
    if (assigneeId) {
      const selectedPerson = people.find(p => p.id === assigneeId);
      if (selectedPerson) {
        newTask.assignees = [selectedPerson];
      }
    }
    
    if (milestoneId) {
      const selectedMilestone = milestones.find(m => m.id === milestoneId);
      if (selectedMilestone) {
        newTask.milestone = selectedMilestone;
      }
    }
    
    // Submit the task
    onCreateTask(newTask);
    
    // Handle form after submission
    if (createMore) {
      resetForm();
    } else {
      onClose();
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Task"
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          variant="form-field"
          label="Task title"
          text={title}
          onChange={setTitle}
          placeholder="Enter task title"
          autofocus
          testId="task-title"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="due-date" className="block text-sm font-medium text-content-base mb-1">
              Due date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IconCalendar size={16} className="text-content-subtle" />
              </div>
              <input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-surface-outline rounded-md focus:outline-none focus:ring-2 focus:ring-primary-base"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="assignee" className="block text-sm font-medium text-content-base mb-1">
              Assignee
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IconUser size={16} className="text-content-subtle" />
              </div>
              <select
                id="assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-surface-outline rounded-md focus:outline-none focus:ring-2 focus:ring-primary-base appearance-none"
              >
                <option value="">Select assignee</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="milestone" className="block text-sm font-medium text-content-base mb-1">
            Milestone
          </label>
          <select
            id="milestone"
            value={milestoneId}
            onChange={(e) => setMilestoneId(e.target.value)}
            className="w-full px-3 py-2 border border-surface-outline rounded-md focus:outline-none focus:ring-2 focus:ring-primary-base appearance-none"
          >
            <option value="">No milestone</option>
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center mt-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={createMore}
              onChange={() => setCreateMore(!createMore)}
              className="h-4 w-4 text-primary-base border-surface-outline rounded focus:ring-primary-base"
            />
            <span className="ml-2 text-sm text-content-base">Create more</span>
          </label>
          <div className="flex-1"></div>
          <div className="flex space-x-3">
            <SecondaryButton onClick={onClose} type="button">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={!title.trim()}>
              Create Task
            </PrimaryButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default TaskCreationModal;
