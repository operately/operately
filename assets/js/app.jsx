import React from "react";
import ReactDOM from "react-dom";
import ReactDOMClient from 'react-dom/client';
import axios from 'axios';

axios.defaults.headers.common['X-CSRF-TOKEN'] = document.head.querySelector('meta[name="csrf-token"]').content;

import { define } from 'remount';

import GroupsIndexPage from "./groups/index";
define({"x-groups-index": GroupsIndexPage});

import GroupsShowPage from "./groups/show";
define({"x-groups-show": GroupsShowPage})
