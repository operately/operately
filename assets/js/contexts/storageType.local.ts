const configStorageUsage = { 
  REACT_APP_STORAGE_TYPE: window.appConfig.environment === "development" ? "local" : "s3",
};

export default configStorageUsage;
