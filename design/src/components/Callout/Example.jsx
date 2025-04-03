import React from "react";
import * as Callout from "./index";

export function BasicInfoCallouts() {
  return (
    <div className="space-y-4">
      <Callout.InfoCallout message="This is an info callout" />
      
      <Callout.InfoCallout 
        message="This is an info callout" 
        description="This is the description of the info callout."
      />
      
      <Callout.InfoCallout message="Want markup in your info callout?">
        <div>Add a Reviewer to get feedback and keep things moving smoothly.</div>
      </Callout.InfoCallout>
    </div>
  );
}

export function BasicWarningCallouts() {
  return (
    <div className="space-y-4">
      <Callout.WarningCallout message="This is a warning callout with a link">
        <a href="#" className="underline hover:text-yellow-800">with a link</a>
      </Callout.WarningCallout>
      
      <Callout.WarningCallout 
        message="This is a warning callout" 
        description="This is the description of the warning callout."
      />
    </div>
  );
}

export function BasicErrorCallouts() {
  return (
    <div className="space-y-4">
      <Callout.ErrorCallout message="This is an error alert" />
      
      <Callout.ErrorCallout message="This is an error alert">
        <ul className="list-disc pl-5 space-y-1">
          <li>Your password must be at least 8 characters</li>
          <li>Your password must include at least one pro wrestling finishing move</li>
        </ul>
      </Callout.ErrorCallout>
    </div>
  );
}

export function BasicSuccessCallouts() {
  return (
    <div className="space-y-4">
      <Callout.SuccessCallout message="Successfully uploaded" />
      
      <Callout.SuccessCallout 
        message="Retrospective submitted" 
        description="All project contributors were notified"
      />
    </div>
  );
}

export function AllCalloutExamples() {
  return (
    <div className="space-y-4">
      <Callout.InfoCallout message="This is an info callout" />
      
      <Callout.InfoCallout 
        message="This is an info callout" 
        description="This is the description of the info callout."
      />
      
      <Callout.InfoCallout message="Want markup in your info callout?">
        <div>Add a Reviewer to get feedback and keep things moving smoothly.</div>
      </Callout.InfoCallout>
      
      <Callout.WarningCallout message="This is a warning callout">
        <a href="#" className="underline hover:text-yellow-800">with a link</a>
      </Callout.WarningCallout>
      
      <Callout.WarningCallout 
        message="This is a warning callout" 
        description="This is the description of the warning callout."
      />
      
      <Callout.ErrorCallout message="This is an error alert" />
      
      <Callout.ErrorCallout message="This is an error alert">
        <ul className="list-disc pl-5 space-y-1">
          <li>Your password must be at least 8 characters</li>
          <li>Your password must include at least one pro wrestling finishing move</li>
        </ul>
      </Callout.ErrorCallout>
      
      <Callout.SuccessCallout message="Successfully uploaded" />
      
      <Callout.SuccessCallout 
        message="Retrospective submitted" 
        description="All project contributors were notified"
      />
    </div>
  );
}
