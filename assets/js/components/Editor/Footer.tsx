import React from 'react';

import Button, {ButtonSize} from '../../components/Button';

interface FooterProps {
  onSave: () => void;
}

export default function Footer({onSave} : FooterProps) : JSX.Element {
  return <div className="bg-light-1 p-2 border-t border-stone-200 flex justify-between">
    <div></div>
    <Button onClick={onSave} size={ButtonSize.Small} >Post</Button>
  </div>;
}
