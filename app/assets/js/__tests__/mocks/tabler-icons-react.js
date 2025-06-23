// Mock for @tabler/icons-react
const createMockIcon = (name) => {
  const component = (props) => {
    return {
      type: 'svg',
      props: {
        ...props,
        'data-testid': `mock-icon-${name}`,
      },
      key: null,
      ref: null,
    };
  };
  component.displayName = name;
  return component;
};

// Create a proxy that returns a mock icon for any imported icon
module.exports = new Proxy(
  {},
  {
    get: function(target, prop) {
      return createMockIcon(prop);
    }
  }
);
