const React = require("react");

// Mock for @tabler/icons-react
const createMockIcon = (name) => {
  const component = (props) => {
    return React.createElement("svg", {
      ...props,
      "data-testid": `mock-icon-${name}`,
    });
  };
  component.displayName = name;
  return component;
};

// Create a proxy that returns a mock icon for any imported icon
module.exports = new Proxy(
  {},
  {
    get: function (target, prop) {
      if (prop === "__esModule") {
        return true;
      }

      return createMockIcon(prop);
    },
  },
);
