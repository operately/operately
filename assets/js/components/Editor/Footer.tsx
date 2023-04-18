import React from 'react';

import Button, {ButtonSize} from '../../components/Button';

interface FooterProps {
  onSave: () => void;
  submitDisabled: boolean;
}

export default function Footer({onSave, submitDisabled} : FooterProps) : JSX.Element {
  return <div className="bg-light-1 p-2 flex justify-between">
    <div></div>
    <Button disabled={submitDisabled} onClick={onSave} size={ButtonSize.Small} >Post</Button>
  </div>;
}

Footer.defaultProps = {
  submitDisabled: false,
};
