export const PERSON = `
  {
    id
    fullName
    title
    avatarUrl
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
