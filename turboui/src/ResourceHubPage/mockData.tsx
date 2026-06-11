import * as React from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import { Page } from "../Page";
import {
  type AddFileWidgetProps,
  type AddFolderModalProps,
  sortNodesWithFoldersFirst,
  type ResourceHub,
  type ResourceHubDocument,
  type ResourceHubFile,
  type ResourceHubFolder,
  type ResourceHubNode,
  type ResourceHubNodesListContextValue,
  type ResourceHubPermissions,
  type ResourceHubSortBy,
} from "../ResourceHub";
import { SubscribersSelector } from "../Subscriptions";
import type { ResourceHubFormState } from "../ResourceHub/types";
import { asRichText } from "../utils/storybook/richContent";
import { genPeople } from "../utils/storybook/genPeople";

import type { SharedListPageProps } from "./SharedListPage";

const [author, reviewer, subscriber] = genPeople(3);

type MockFormOptions = {
  fields: Record<string, unknown>;
  validate?: (addError: (field: string, message: string) => void) => void;
  cancel?: () => void;
  submit: () => Promise<void> | void;
};

interface MockResourceHubFormState extends ResourceHubFormState {
  errors: Record<string, string>;
  cancel?: () => void;
  submitForm: (event?: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

interface MockModalProps {
  isOpen: boolean;
  hideModal?: () => void;
  title?: string;
  children: React.ReactNode;
}

interface UseMockSharedListPagePropsArgs {
  parent: ResourceHub | ResourceHubFolder;
  parentType: "resource_hub" | "folder";
  nodes: ResourceHubNode[];
  onCreateFolder?: AddFolderModalProps["onCreateFolder"];
  onCreated?: () => void;
}

export function createMockPermissions(overrides: Partial<ResourceHubPermissions> = {}): ResourceHubPermissions {
  return {
    canCreateDocument: true,
    canCreateFile: true,
    canCreateFolder: true,
    canCreateLink: true,
    canView: true,
    ...overrides,
  };
}

export function createMockResourceHub(overrides: Partial<ResourceHub> = {}): ResourceHub {
  return {
    id: "hub-1",
    name: "Engineering Handbook",
    space: { id: "space-1", name: "Operations" } as never,
    permissions: createMockPermissions(),
    ...overrides,
  };
}

export function createMockFolder(overrides: Partial<ResourceHubFolder> = {}): ResourceHubFolder {
  const resourceHub = overrides.resourceHub ?? createMockResourceHub();

  return {
    id: "folder-1",
    resourceHubId: resourceHub.id,
    resourceHub,
    name: "Hiring Playbooks",
    permissions: createMockPermissions({ canRenameFolder: true }),
    pathToFolder: [],
    ...overrides,
  };
}

export function createMockDocumentNode(
  overrides: Omit<Partial<ResourceHubNode>, "document"> & { document?: Partial<ResourceHubDocument> } = {},
): ResourceHubNode {
  const { document: _documentOverride, ...nodeOverrides } = overrides;
  const document: Partial<ResourceHubDocument> = overrides.document ?? {};
  const documentId = document.id ?? "document-1";
  const documentData = {
    ...document,
    id: documentId,
    resourceHubId: document.resourceHubId ?? "hub-1",
    parentFolderId: document.parentFolderId ?? "folder-1",
    name: document.name ?? overrides.name ?? "Quarterly Planning Notes",
    content: document.content ?? JSON.stringify(asRichText("Plan summary for the next quarter.")),
    state: document.state ?? "published",
    author:
      document.author ??
      ({
        id: author?.id ?? "person-1",
        fullName: author?.fullName ?? "Alex Example",
        avatarUrl: author?.avatarUrl ?? null,
      } as never),
  } as ResourceHubDocument;

  return {
    ...nodeOverrides,
    id: overrides.id ?? `node-${documentId}`,
    name: overrides.name ?? "Quarterly Planning Notes",
    type: "document",
    document: documentData,
  };
}

export function createMockDraftNode(
  overrides: Omit<Partial<ResourceHubNode>, "document"> & { document?: Partial<ResourceHubDocument> } = {},
): ResourceHubNode {
  return createMockDocumentNode({
    id: overrides.id ?? "node-draft-1",
    name: overrides.name ?? "Draft Interview Guide",
    document: {
      id: overrides.document?.id ?? "document-draft-1",
      name: overrides.document?.name ?? overrides.name ?? "Draft Interview Guide",
      state: "draft",
      ...overrides.document,
    },
    ...overrides,
  });
}

export function createMockFileNode(
  overrides: Omit<Partial<ResourceHubNode>, "file"> & { file?: Partial<ResourceHubFile> } = {},
): ResourceHubNode {
  const { file: _fileOverride, ...nodeOverrides } = overrides;
  const file: Partial<ResourceHubFile> = overrides.file ?? {};
  const fileId = file.id ?? "file-1";
  const fileData = {
    ...file,
    id: fileId,
    resourceHubId: file.resourceHubId ?? "hub-1",
    parentFolderId: file.parentFolderId ?? "folder-1",
    name: file.name ?? overrides.name ?? "Roadmap Screenshot",
    description: file.description ?? "Updated mockup from the planning session.",
    type: file.type ?? "image",
    blob:
      file.blob ??
      ({
        id: "blob-1",
        url: "/mock-roadmap.png",
        contentType: "image/png",
        width: 1280,
        height: 720,
      } as never),
    author:
      file.author ??
      ({
        id: reviewer?.id ?? "person-2",
        fullName: reviewer?.fullName ?? "Riley Example",
        avatarUrl: reviewer?.avatarUrl ?? null,
      } as never),
  } as ResourceHubFile;

  return {
    ...nodeOverrides,
    id: overrides.id ?? `node-${fileId}`,
    name: overrides.name ?? "Roadmap Screenshot",
    type: "file",
    file: fileData,
  };
}

export function createMockFolderNode(
  overrides: Omit<Partial<ResourceHubNode>, "folder"> & { folder?: Partial<ResourceHubFolder> } = {},
): ResourceHubNode {
  const { folder: _folderOverride, ...nodeOverrides } = overrides;
  const folderId = overrides.folder?.id ?? "folder-node-1";
  const resourceHub = overrides.folder?.resourceHub ?? createMockResourceHub();
  const folderData = {
    ...overrides.folder,
    id: folderId,
    resourceHubId: overrides.folder?.resourceHubId ?? resourceHub.id,
    resourceHub,
    name: overrides.folder?.name ?? overrides.name ?? "Team Templates",
    permissions: overrides.folder?.permissions ?? createMockPermissions({ canRenameFolder: true }),
    pathToFolder: overrides.folder?.pathToFolder ?? [],
  } as ResourceHubFolder;

  return {
    ...nodeOverrides,
    id: overrides.id ?? `node-${folderId}`,
    name: overrides.name ?? "Team Templates",
    type: "folder",
    folder: folderData,
  };
}

export function MockModal({ isOpen, hideModal, title, children }: MockModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4" role="dialog" aria-label={title}>
      <div className="w-full max-w-lg rounded-lg border border-surface-outline bg-surface-base p-6 shadow-xl">
        {title && <div className="mb-4 text-lg font-bold">{title}</div>}
        {children}
        {hideModal && (
          <div className="mt-4 flex justify-end">
            <SecondaryButton size="sm" onClick={hideModal}>
              Close
            </SecondaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

export function useMockSharedListPageProps({
  parent,
  parentType,
  nodes,
  onCreateFolder,
  onCreated,
}: UseMockSharedListPagePropsArgs): SharedListPageProps {
  const forms = React.useMemo(() => createMockFormsApi(), []);
  const modal = React.useMemo(() => ({ Modal: MockModal }), []);
  const folderParent = parentType === "folder" ? (parent as ResourceHubFolder) : null;
  const resourceHubParent = parentType === "resource_hub" ? (parent as ResourceHub) : null;
  const permissions = parent.permissions ?? createMockPermissions();
  const resourceHub =
    folderParent?.resourceHub ??
    (folderParent ? createMockResourceHub({ id: folderParent.resourceHubId ?? "hub-1" }) : resourceHubParent) ??
    createMockResourceHub();
  const folderId = folderParent?.id;
  const subscribers = useMockSubscribers();
  const newFileModals = useMockNewFileModals();
  const [sortBy, setSortBy] = React.useState<ResourceHubSortBy>("name");

  const sortedNodes = React.useMemo(() => {
    const order = sortBy === "name" ? "asc" : "desc";

    return sortNodesWithFoldersFirst(nodes, sortBy, order);
  }, [nodes, sortBy]);

  const getNodePath = React.useCallback((node: ResourceHubNode) => buildNodePath(node), []);

  const listContext = React.useMemo<ResourceHubNodesListContextValue>(() => {
    const parentId = parent.id ?? resourceHub.id;
    const parentName = parent.name ?? resourceHub.name ?? "Resource Hub";
    const folderNodes = nodes
      .map((node) => node.folder)
      .filter((folder): folder is ResourceHubFolder => Boolean(folder));

    return {
      parent: {
        id: parentId,
        name: parentName,
        type: parentType,
        resourceHubId: folderParent?.resourceHubId ?? resourceHub.id,
      },
      forms,
      modal,
      permissions,
      onRefetch: onCreated,
      paths: {
        editDocumentPath: (id) => `/resource-hub/documents/${id}/edit`,
        editFilePath: (id) => `/resource-hub/files/${id}/edit`,
        editLinkPath: (id) => `/resource-hub/links/${id}/edit`,
        documentPath: (id) => `/resource-hub/documents/${id}`,
        folderPath: (id) => `/resource-hub/folders/${id}`,
      },
      actions: {
        copyDocument: async () => undefined,
        copyFolder: async () => undefined,
        moveResource: async () => undefined,
        renameFolder: async () => undefined,
        deleteDocument: async () => undefined,
        deleteFile: async () => undefined,
        deleteFolder: async () => undefined,
        deleteLink: async () => undefined,
        downloadFile: () => undefined,
        exportDocumentMarkdown: () => undefined,
      },
      folderSelect: {
        loadFolder: async (id) => {
          const folder =
            folderNodes.find((item) => item.id === id) ??
            (folderParent?.id === id ? folderParent : createMockFolder({ id, resourceHub, resourceHubId: resourceHub.id }));

          return {
            current: { type: "folder", folder },
            nodes: [],
          };
        },
        loadResourceHub: async () => ({
          current: { type: "resourceHub", resourceHub },
          nodes: folderNodes.map((folder) =>
            createMockFolderNode({
              id: `node-${folder.id}`,
              name: folder.name ?? "Folder",
              folder,
            }),
          ),
        }),
        compareIds: (left, right) => left === right,
      },
    };
  }, [folderParent, forms, modal, nodes, onCreated, parent, parentType, permissions, resourceHub]);

  return {
    title: parent.name ?? resourceHub.name ?? "Resource Hub",
    navigation: buildNavigation(parent, parentType, resourceHub),
    newFileModals,
    addFileWidgetProps: {
      forms,
      modal,
      subscriptions: subscribers,
      mentionSearchScope: { type: "resource_hub", id: resourceHub.id },
      formatFileSize: (size) => `${size} bytes`,
      onUpload: async (_items, setProgress) => {
        setProgress(100);
      },
    },
    nodesListProps: {
      nodes: sortedNodes,
      getNodePath,
      sortBy,
      onSortChange: setSortBy,
      emptyVariant: parentType === "resource_hub" ? "hub" : "folder",
      listContext,
      getNodeTestId: (_node, index) => `node-${index}`,
    },
    addFolderModalProps: {
      resourceHubId: resourceHub.id,
      folderId,
      onCreated: onCreated ?? (() => undefined),
      forms,
      modal,
      onCreateFolder: onCreateFolder ?? (async () => undefined),
    },
  };
}

function buildNavigation(
  parent: ResourceHub | ResourceHubFolder,
  parentType: UseMockSharedListPagePropsArgs["parentType"],
  resourceHub: ResourceHub,
): NonNullable<Page.Props["navigation"]> {
  const space = resourceHub.space ?? ({ id: "space-1", name: "Operations" } as never);

  if (parentType === "resource_hub") {
    return [{ to: `/spaces/${space.id}`, label: space.name ?? "Operations" }];
  }

  const folder = parent as ResourceHubFolder;

  return [
    { to: `/spaces/${space.id}`, label: space.name ?? "Operations" },
    { to: `/resource-hubs/${resourceHub.id}`, label: resourceHub.name ?? "Resource Hub" },
    ...((folder.pathToFolder ?? []).map((item) => ({
      to: `/resource-hubs/folders/${item.id}`,
      label: item.name ?? "Folder",
    })) as NonNullable<Page.Props["navigation"]>),
  ];
}

function buildNodePath(node: ResourceHubNode) {
  if (node.document?.id) {
    return `/resource-hub/documents/${node.document.id}`;
  }

  if (node.file?.id) {
    return `/resource-hub/files/${node.file.id}`;
  }

  if (node.folder?.id) {
    return `/resource-hub/folders/${node.folder.id}`;
  }

  if (node.link?.id) {
    return `/resource-hub/links/${node.link.id}`;
  }

  return "#";
}

function useMockNewFileModals() {
  const [showAddFolder, setShowAddFolder] = React.useState(false);
  const [files, setFiles] = React.useState<File[] | undefined>(undefined);

  return React.useMemo(
    () => ({
      showAddFolder,
      toggleShowAddFolder: () => setShowAddFolder((current) => !current),
      navigateToNewDocument: () => undefined,
      navigateToNewLink: () => undefined,
      files,
      setFiles,
      selectFiles: () => undefined,
      filesSelected: Boolean(files?.length),
    }),
    [files, showAddFolder],
  );
}

function useMockSubscribers(): SubscribersSelector.Props {
  const availableSubscribers = React.useMemo<SubscribersSelector.Subscriber[]>(
    () => [
      { person: subscriber ?? { id: "person-3", fullName: "Jordan Example", avatarUrl: null }, isSubscribed: false },
      { person: reviewer ?? { id: "person-2", fullName: "Riley Example", avatarUrl: null }, isSubscribed: false },
    ],
    [],
  );
  const [selectedSubscribers, setSelectedSubscribers] = React.useState<SubscribersSelector.Subscriber[]>([]);
  const [subscriptionType, setSubscriptionType] = React.useState<SubscribersSelector.SubscriptionOption>(
    SubscribersSelector.SubscriptionOption.ALL,
  );

  return {
    subscribers: availableSubscribers,
    selectedSubscribers,
    onSelectedSubscribersChange: setSelectedSubscribers,
    subscriptionType,
    onSubscriptionTypeChange: setSubscriptionType,
    alwaysNotify: [],
    allSubscribersLabel: "Everyone with access to this resource",
  };
}

function createMockFormsApi(): AddFileWidgetProps["forms"] {
  const FormContext = React.createContext<MockResourceHubFormState | null>(null);

  function useForm(options: MockFormOptions): MockResourceHubFormState {
    const initialValuesRef = React.useRef(deepClone(options.fields));
    const [values, setValues] = React.useState<Record<string, unknown>>(() => deepClone(options.fields));
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [state, setState] = React.useState<string | undefined>(undefined);

    const submitForm = React.useCallback(
      async (event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault();

        const nextErrors: Record<string, string> = {};
        options.validate?.((field, message) => {
          nextErrors[field] = message;
        });

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
          return;
        }

        setState("submitting");

        try {
          await options.submit();
        } finally {
          setState(undefined);
        }
      },
      [options],
    );

    return {
      values,
      state,
      errors,
      cancel: options.cancel,
      submitForm,
      actions: {
        reset: () => {
          setValues(deepClone(initialValuesRef.current));
          setErrors({});
          setState(undefined);
        },
        setValue: (field, value) => {
          setValues((current) => setValueAtPath(current, field, value));
        },
      },
    };
  }

  function Form({
    form,
    testId,
    children,
  }: {
    form: ResourceHubFormState;
    testId?: string;
    children: React.ReactNode;
  }) {
    const mockForm = form as MockResourceHubFormState;

    return (
      <FormContext.Provider value={mockForm}>
        <form onSubmit={mockForm.submitForm} data-test-id={testId}>
          {children}
        </form>
      </FormContext.Provider>
    );
  }

  function FieldGroup({ layout, children }: { layout?: string; children: React.ReactNode }) {
    const className = layout === "vertical" ? "flex flex-col gap-4" : "flex flex-col gap-4";

    return <div className={className}>{children}</div>;
  }

  function TextInput({
    label,
    field,
    testId,
    autoFocus,
    required,
    placeholder,
  }: {
    label?: string;
    field: string;
    testId?: string;
    autoFocus?: boolean;
    required?: boolean;
    placeholder?: string;
  }) {
    const [value, setValue] = useFieldValue<string>(field);
    const error = useFieldError(field);

    return (
      <label className="block">
        {label && <div className="mb-1 text-sm font-bold">{label}</div>}
        <input
          autoFocus={autoFocus}
          className="w-full rounded-lg border border-stroke-base px-3 py-2"
          data-test-id={testId}
          placeholder={placeholder}
          required={required}
          value={value ?? ""}
          onChange={(event) => setValue(event.target.value)}
        />
        {error && <div className="mt-1 text-sm text-content-error">{error}</div>}
      </label>
    );
  }

  function RichTextArea({
    field,
    placeholder,
    height,
  }: {
    field: string;
    placeholder?: string;
    mentionSearchScope: { type: string; id: string };
    height?: string;
  }) {
    const [value, setValue] = useFieldValue<string>(field);

    return (
      <textarea
        className={`w-full rounded-lg border border-stroke-base px-3 py-2 ${height ?? ""}`.trim()}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(event) => setValue(event.target.value)}
      />
    );
  }

  function Submit({ saveText = "Save", cancelText = "Cancel" }: { saveText?: string; cancelText?: string }) {
    const form = useMockFormContext(FormContext);

    return (
      <div className="mt-6 flex items-center gap-2">
        <PrimaryButton type="submit" loading={form.state === "submitting"}>
          {saveText}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => form.cancel?.()}>
          {cancelText}
        </SecondaryButton>
      </div>
    );
  }

  function InputField({
    label,
    field,
    error,
    children,
  }: {
    label: string;
    field: string;
    error?: string;
    children: React.ReactNode;
  }) {
    const fieldError = error ?? useFieldError(field);

    return (
      <div>
        <div className="mb-1 text-sm font-bold">{label}</div>
        {children}
        {fieldError && <div className="mt-1 text-sm text-content-error">{fieldError}</div>}
      </div>
    );
  }

  function useFieldValue<T>(field: string): [T, (value: T) => void] {
    const form = useMockFormContext(FormContext);
    const value = getValueAtPath(form.values, field) as T;

    return [
      value,
      (nextValue: T) => {
        form.actions.setValue(field, nextValue);
      },
    ];
  }

  function useFieldError(field: string) {
    const form = useMockFormContext(FormContext);

    return form.errors[field];
  }

  return {
    useForm,
    Form,
    FieldGroup,
    TextInput,
    Submit,
    InputField,
    useFieldValue,
    useFieldError,
    RichTextArea,
  };
}

function useMockFormContext(context: React.Context<MockResourceHubFormState | null>) {
  const value = React.useContext(context);

  if (!value) {
    throw new Error("Mock form context is missing");
  }

  return value;
}

function getValueAtPath(value: unknown, path: string): unknown {
  return parsePath(path).reduce<unknown>((current, part) => {
    if (current === null || current === undefined) {
      return undefined;
    }

    return (current as Record<string | number, unknown>)[part];
  }, value);
}

function setValueAtPath(values: Record<string, unknown>, path: string, nextValue: unknown): Record<string, unknown> {
  const parts = parsePath(path);

  if (parts.length === 0) {
    return values;
  }

  const clone = deepClone(values);
  let current: Record<string | number, unknown> | unknown[] = clone;
  let source: Record<string | number, unknown> | unknown[] | undefined = values;

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];

    if (part === undefined) {
      continue;
    }

    if (index === parts.length - 1) {
      current[part] = nextValue;
      continue;
    }

    const nextPart = parts[index + 1];
    const sourceValue = source?.[part];
    const nestedValue =
      sourceValue !== null && sourceValue !== undefined
        ? deepClone(sourceValue)
        : typeof nextPart === "number"
          ? []
          : {};

    current[part] = nestedValue;
    current = nestedValue as Record<string | number, unknown> | unknown[];
    source = sourceValue as Record<string | number, unknown> | unknown[] | undefined;
  }

  return clone;
}

function parsePath(path: string): Array<string | number> {
  return path
    .replace(/\]/g, "")
    .split(/\.|\[/)
    .filter(Boolean)
    .map((part) => (/^\d+$/.test(part) ? Number(part) : part));
}

function deepClone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, deepClone(entryValue)]),
    ) as T;
  }

  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
}
