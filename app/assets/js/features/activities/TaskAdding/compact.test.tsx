/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { testCompactHandler } from "../activityHandlerTestSupport";
import Handler from ".";
testCompactHandler(Handler, "task_adding");
