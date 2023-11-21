import React from "react";
import { useColorMode } from "@/theme";

export const Github = ({ size }) => {
  const mode = useColorMode();

  if (mode === "light") {
    return <GithubBlack size={size} />;
  } else {
    return <GithubWhite size={size} />;
  }
};

const GithubBlack = ({ size }) => (
  <svg
    viewBox="0 0 98 96"
    width={size + "px"}
    height={size + "px"}
    preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      fill="#24292f"
    />
  </svg>
);

const GithubWhite = ({ size }) => (
  <svg
    viewBox="0 0 98 96"
    width={size + "px"}
    height={size + "px"}
    preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      fill="#fff"
    />
  </svg>
);

export const GoogleSheets = ({ size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    width={size + "px"}
    height={size + "px"}
    viewBox="0 0 49 67"
  >
    <defs>
      <path
        id="path-1"
        d="M29.583 0H4.438A4.45 4.45 0 000 4.438v56.208a4.45 4.45 0 004.438 4.437h38.458a4.45 4.45 0 004.437-4.437V17.75L29.583 0z"
      ></path>
      <path
        id="path-3"
        d="M29.583 0H4.438A4.45 4.45 0 000 4.438v56.208a4.45 4.45 0 004.438 4.437h38.458a4.45 4.45 0 004.437-4.437V17.75L29.583 0z"
      ></path>
      <path
        id="path-5"
        d="M29.583 0H4.438A4.45 4.45 0 000 4.438v56.208a4.45 4.45 0 004.438 4.437h38.458a4.45 4.45 0 004.437-4.437V17.75L29.583 0z"
      ></path>
      <linearGradient id="linearGradient-7" x1="50.005%" x2="50.005%" y1="8.586%" y2="100.014%">
        <stop offset="0%" stopColor="#263238" stopOpacity="0.2"></stop>
        <stop offset="100%" stopColor="#263238" stopOpacity="0.02"></stop>
      </linearGradient>
      <path
        id="path-8"
        d="M29.583 0H4.438A4.45 4.45 0 000 4.438v56.208a4.45 4.45 0 004.438 4.437h38.458a4.45 4.45 0 004.437-4.437V17.75L29.583 0z"
      ></path>
      <path
        id="path-10"
        d="M29.583 0H4.438A4.45 4.45 0 000 4.438v56.208a4.45 4.45 0 004.438 4.437h38.458a4.45 4.45 0 004.437-4.437V17.75L29.583 0z"
      ></path>
      <path
        id="path-12"
        d="M29.583 0H4.438A4.45 4.45 0 000 4.438v56.208a4.45 4.45 0 004.438 4.437h38.458a4.45 4.45 0 004.437-4.437V17.75L29.583 0z"
      ></path>
      <path
        id="path-14"
        d="M29.583 0H4.438A4.45 4.45 0 000 4.438v56.208a4.45 4.45 0 004.438 4.437h38.458a4.45 4.45 0 004.437-4.437V17.75L29.583 0z"
      ></path>
      <radialGradient
        id="radialGradient-16"
        cx="3.168%"
        cy="2.717%"
        r="161.249%"
        fx="3.168%"
        fy="2.717%"
        gradientTransform="matrix(1 0 0 .72727 0 .007)"
      >
        <stop offset="0%" stopColor="#FFF" stopOpacity="0.1"></stop>
        <stop offset="100%" stopColor="#FFF" stopOpacity="0"></stop>
      </radialGradient>
    </defs>
    <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
      <g transform="translate(-451 -451)">
        <g transform="translate(0 63)">
          <g transform="translate(277 299)">
            <g transform="translate(174.833 89.958)">
              <g>
                <g>
                  <mask id="mask-2" fill="#fff">
                    <use xlinkHref="#path-1"></use>
                  </mask>
                  <path
                    fill="#0F9D58"
                    fillRule="nonzero"
                    d="M29.583 0H4.438A4.45 4.45 0 000 4.438v56.208a4.45 4.45 0 004.438 4.437h38.458a4.45 4.45 0 004.437-4.437V17.75L36.98 10.354 29.583 0z"
                    mask="url(#mask-2)"
                  ></path>
                </g>
                <g>
                  <mask id="mask-4" fill="#fff">
                    <use xlinkHref="#path-3"></use>
                  </mask>
                  <path
                    fill="#F1F1F1"
                    fillRule="nonzero"
                    d="M11.833 31.802V53.25H35.5V31.802H11.833zm10.354 18.49h-7.395v-3.698h7.396v3.698zm0-5.917h-7.395v-3.698h7.396v3.698zm0-5.917h-7.395V34.76h7.396v3.698zm10.355 11.834h-7.396v-3.698h7.396v3.698zm0-5.917h-7.396v-3.698h7.396v3.698zm0-5.917h-7.396V34.76h7.396v3.698z"
                    mask="url(#mask-4)"
                  ></path>
                </g>
                <g>
                  <mask id="mask-6" fill="#fff">
                    <use xlinkHref="#path-5"></use>
                  </mask>
                  <path
                    fill="url(#linearGradient-7)"
                    fillRule="nonzero"
                    d="M30.8813021 16.4520313L47.3333333 32.9003646 47.3333333 17.75z"
                    mask="url(#mask-6)"
                  ></path>
                </g>
                <g>
                  <mask id="mask-9" fill="#fff">
                    <use xlinkHref="#path-8"></use>
                  </mask>
                  <g mask="url(#mask-9)">
                    <g transform="translate(26.625 -2.958)">
                      <path
                        fill="#87CEAC"
                        fillRule="nonzero"
                        d="M2.958 2.958v13.313a4.436 4.436 0 004.438 4.437h13.312L2.958 2.958z"
                      ></path>
                    </g>
                  </g>
                </g>
                <g>
                  <mask id="mask-11" fill="#fff">
                    <use xlinkHref="#path-10"></use>
                  </mask>
                  <path
                    fill="#FFF"
                    fillOpacity="0.2"
                    fillRule="nonzero"
                    d="M4.438 0A4.45 4.45 0 000 4.438v.37A4.45 4.45 0 014.438.37h25.145V0H4.438z"
                    mask="url(#mask-11)"
                  ></path>
                </g>
                <g>
                  <mask id="mask-13" fill="#fff">
                    <use xlinkHref="#path-12"></use>
                  </mask>
                  <path
                    fill="#263238"
                    fillOpacity="0.2"
                    fillRule="nonzero"
                    d="M42.896 64.714H4.437A4.45 4.45 0 010 60.276v.37a4.45 4.45 0 004.438 4.437h38.458a4.45 4.45 0 004.437-4.437v-.37a4.45 4.45 0 01-4.437 4.438z"
                    mask="url(#mask-13)"
                  ></path>
                </g>
                <g>
                  <mask id="mask-15" fill="#fff">
                    <use xlinkHref="#path-14"></use>
                  </mask>
                  <path
                    fill="#263238"
                    fillOpacity="0.1"
                    fillRule="nonzero"
                    d="M34.02 17.75a4.436 4.436 0 01-4.437-4.438v.37a4.436 4.436 0 004.438 4.438h13.312v-.37H34.021z"
                    mask="url(#mask-15)"
                  ></path>
                </g>
              </g>
              <path
                fill="url(#radialGradient-16)"
                fillRule="nonzero"
                d="M29.583 0H4.438A4.45 4.45 0 000 4.438v56.208a4.45 4.45 0 004.438 4.437h38.458a4.45 4.45 0 004.437-4.437V17.75L29.583 0z"
              ></path>
            </g>
          </g>
        </g>
      </g>
    </g>
  </svg>
);
