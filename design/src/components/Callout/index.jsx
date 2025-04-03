import React from "react";

/**
 * Base Callout component that's used by all callout variants
 * @param {Object} props - Component props
 * @param {React.ReactNode|string} props.message - Main message to display
 * @param {React.ReactNode|string} [props.description] - Optional detailed description
 * @param {React.ElementType} props.icon - Icon component to display
 * @param {string} props.iconClassName - CSS class for the icon
 * @param {string} props.backgroundColor - CSS class for the background color
 * @param {string} props.titleColor - CSS class for the title text color
 * @param {string} props.messageColor - CSS class for the message text color
 * @returns {JSX.Element} Callout component
 */
function UnstyledCallout({
  message,
  description,
  icon: Icon,
  iconClassName,
  backgroundColor,
  titleColor,
  messageColor,
  children,
}) {
  return (
    <div className={`rounded-md ${backgroundColor} p-4`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon aria-hidden="true" className={`${iconClassName} h-5 w-5`} />
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-semibold ${titleColor}`}>{message}</h3>
          {description && (
            <div className={`mt-2 text-sm ${messageColor}`}>{description}</div>
          )}
          {children && (
            <div className={`mt-2 text-sm ${messageColor}`}>{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Icon components
function IconInfoCircle(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="currentColor"
        opacity="0.2"
        stroke="none"
      />
      <circle cx="12" cy="12" r="10" fill="none" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconAlertTriangle(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        fill="currentColor"
        opacity="0.2"
        stroke="none"
      />
      <path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        fill="none"
      />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconCircleX(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="currentColor"
        opacity="0.2"
        stroke="none"
      />
      <circle cx="12" cy="12" r="10" fill="none" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function IconCircleCheck(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="currentColor"
        opacity="0.2"
        stroke="none"
      />
      <circle cx="12" cy="12" r="10" fill="none" />
      <polyline points="16 10 12 14 8 10" transform="rotate(90 12 12)" />
    </svg>
  );
}

/**
 * Info Callout - Used for general information and neutral messages
 * @param {Object} props - Component propsall
 * @param {React.ReactNode|string} props.message - Main message to display
 * @param {React.ReactNode|string} [props.description] - Optional detailed description
 * @returns {JSX.Element} Info Callout component
 */
export function InfoCallout({ message, description, children }) {
  return (
    <UnstyledCallout
      message={message}
      description={description}
      icon={IconInfoCircle}
      iconClassName="text-callout-info-icon"
      backgroundColor="bg-callout-info"
      titleColor="text-callout-info-message"
      messageColor="text-callout-info-message"
      children={children}
    />
  );
}

/**
 * Warning Callout - Used for warnings that require attention
 * @param {Object} props - Component props
 * @param {React.ReactNode|string} props.message - Main message to display
 * @param {React.ReactNode|string} [props.description] - Optional detailed description
 * @returns {JSX.Element} Warning Callout component
 */
export function WarningCallout({ message, description, children }) {
  return (
    <UnstyledCallout
      message={message}
      description={description}
      icon={IconAlertTriangle}
      iconClassName="text-callout-warning-icon"
      backgroundColor="bg-callout-warning"
      titleColor="text-callout-warning-message"
      messageColor="text-callout-warning-message"
      children={children}
    />
  );
}

/**
 * Error Callout - Used for errors and critical issues
 * @param {Object} props - Component props
 * @param {React.ReactNode|string} props.message - Main message to display
 * @param {React.ReactNode|string} [props.description] - Optional detailed description
 * @returns {JSX.Element} Error Callout component
 */
export function ErrorCallout({ message, description, children }) {
  return (
    <UnstyledCallout
      message={message}
      description={description}
      icon={IconCircleX}
      iconClassName="text-callout-error-icon"
      backgroundColor="bg-callout-error"
      titleColor="text-callout-error-message"
      messageColor="text-callout-error-message"
      children={children}
    />
  );
}

/**
 * Success Callout - Used for successful actions and positive confirmation
 * @param {Object} props - Component props
 * @param {React.ReactNode|string} props.message - Main message to display
 * @param {React.ReactNode|string} [props.description] - Optional detailed description
 * @returns {JSX.Element} Success Callout component
 */
export function SuccessCallout({ message, description, children }) {
  return (
    <UnstyledCallout
      message={message}
      description={description}
      icon={IconCircleCheck}
      iconClassName="text-callout-success-icon"
      backgroundColor="bg-callout-success"
      titleColor="text-callout-success-message"
      messageColor="text-callout-success-message"
      children={children}
    />
  );
}
