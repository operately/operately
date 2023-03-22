import React from "react";
import ReactDOM from "react-dom";
import ReactDOMClient from 'react-dom/client';

import { define } from 'remount';

import GroupsIndexPage from "./groups/index";
define({"x-groups-index": GroupsIndexPage});
