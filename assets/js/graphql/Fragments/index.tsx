export const GROUP = `
  {
    id
    name
    mission
  }
`;

export const PERSON = `
  {
    id
    fullName
    title
    avatarUrl
  }
`;

export const REACTION = `
  {
    reactionType
    person ${PERSON}
  }
`;

export const COMMENT = `
  {
    id
    message
    insertedAt
    
    author ${PERSON}
    reactions ${REACTION}
  }
`;

export const KEY_RESULT = `
  {
    id
    name
    status
    stepsCompleted
    stepsTotal
    updatedAt
    
    owner ${PERSON}
    group ${GROUP}
  }
`;

export const CONTRIBUTOR = `
  {
    id 
    person ${PERSON}
    responsibility
    role
  }
`;

export const PROJECT = `
  {
    id
    name
    description
    updatedAt
    startedAt
    deadline
    
    owner ${PERSON}
    contributors ${CONTRIBUTOR}
  }
`;

export const PROJECT_DOCUMENT = `
  {
    id
    title
    content
    insertedAt
    author ${PERSON}
  }
`;
