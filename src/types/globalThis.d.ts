import type {  Request, Response } from "express";

declare global {
  var rootDir: string;

  // View rendering
  var view: (file: string, data?: Record<string, unknown>) => Promise<string>;
  
  // Asset helpers
  var helper: {
    assets: (file: string) => string;
  };
}

export {};