import React from 'react';

import Button, {ButtonSize} from '../../components/Button';

export default function Footer() : JSX.Element {
  return <div className="bg-light-1 p-2 border-t border-stone-200 flex justify-between">
    <div></div>
    <Button size={ButtonSize.Small} >Post</Button>
  </div>;
}
