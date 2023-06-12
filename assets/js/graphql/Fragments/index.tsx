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

export const ACTIVITY = `
  {
    __typename
    id
    insertedAt

    author ${PERSON}

    ... on ActivityStatusUpdate {
      message
      acknowledged
      acknowledgedAt

      acknowledgingPerson ${PERSON}
      reactions ${REACTION}
      comments ${COMMENT}
    }
  }
`;

export const ACTIVITY_WITH_PROJECT = `
  {
    __typename
    id
    insertedAt

    author ${PERSON}

    project {
      id
      name
    }

    ... on ActivityStatusUpdate {
      message
      acknowledged
      acknowledgedAt

      acknowledgingPerson ${PERSON}
      reactions ${REACTION}
      comments ${COMMENT}
    }
  }
`;

export const CONTRIBUTOR = `
  {
    person ${PERSON}
    responsibility
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
