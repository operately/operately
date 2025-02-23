import React from "react";

import * as Router from "react-router-dom";

import { prefetch, usePeekContext } from "@/layouts/CompanyLayout/PeekWindow";

type LinkTarget = "_self" | "_blank" | "_peek";

interface Props {
  to: string;
  children: React.ReactNode;
  target?: LinkTarget;
  testId?: string;
  className?: string;
}

export function Link(props: Props) {
  const target = props.target || "_self";
  const path = usePath(props.to, target);
  const ref = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry && entry.isIntersecting) {
        prefetch(props.to);
      }
    });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [props.to]);

  if (props.target === "_blank") {
    return (
      <a href={path} className={props.className} data-test-id={props.testId} target={props.target}>
        {props.children}
      </a>
    );
  } else {
    const target = props.target === "_peek" ? "_self" : props.target;

    return (
      <Router.Link to={path} ref={ref} className={props.className} data-test-id={props.testId} target={target}>
        {props.children}
      </Router.Link>
    );
  }
}

function usePath(path: string, target: LinkTarget) {
  const peek = usePeekContext();

  if (target === "_peek" || (target === "_self" && peek)) {
    const location = Router.useLocation();
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("peek", path);
    return `${location.pathname}?${searchParams.toString()}`;
  } else {
    return path;
  }
}
