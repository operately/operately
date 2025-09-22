import { RichEditorHandlers, MentionedPersonLookupFn, UploadFileFn } from "../../RichEditor/useEditor";
import { SearchFn } from "../../RichEditor/extensions/MentionPeople";
import { genPeople, searchPeopleFn } from "./genPeople";

// Mock mentioned person lookup function
const mockMentionedPersonLookup: MentionedPersonLookupFn = async (id: string) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  const people = genPeople(20);
  return people.find((person) => person.id === id) || null;
};

// Mock people search function - reuse existing searchPeopleFn
const mockPeopleSearch: SearchFn = searchPeopleFn;

// Mock file upload function
const mockUploadFile: UploadFileFn = async (file: File, onProgress: (progress: number) => void) => {
  // Simulate upload progress
  for (let progress = 0; progress <= 100; progress += 10) {
    onProgress(progress);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Return mock file data
  return {
    id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url: `https://example.com/uploads/${file.name}`,
  };
};

/**
 * Creates a mock RichEditorHandlers object for use in Storybook stories and tests.
 *
 * @returns {RichEditorHandlers} A complete mock handlers object with all required and optional functions
 */
export function createMockRichEditorHandlers(): RichEditorHandlers {
  return {
    mentionedPersonLookup: mockMentionedPersonLookup,
    peopleSearch: mockPeopleSearch,
    uploadFile: mockUploadFile,
  };
}
