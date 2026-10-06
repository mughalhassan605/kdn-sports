"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// One registration for the whole app. Scroll choreography (pins, scrubs, text
// splits) is GSAP; UI state transitions (drawer, accordion, toast) are Motion.
// The two never animate the same element.
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
gsap.defaults({ ease: "expo.out", duration: 1 });
ScrollTrigger.config({ ignoreMobileResize: true });

export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, SplitText, useGSAP };
