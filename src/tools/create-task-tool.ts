import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

export const createTaskConfig: ToolConfig = {
  id: "create-task",
  name: "Create Task",
  description: "Creates a new task on the specified task list",
  input: z.object({
    tasklistId: z.string().describe("Task list identifier"),
    title: z.string().describe("Title of the task"),
    notes: z.string().optional().describe("Notes describing the task"),
    due: z.string().optional().describe("Due date of the task (RFC 3339 timestamp)"),
    parent: z.string().optional().describe("Parent task identifier"),
    previous: z.string().optional().describe("Previous sibling task identifier"),
  }),
  output: z.object({
    id: z.string(),
    title: z.string(),
    updated: z.string(),
    status: z.string(),
    due: z.string().optional(),
  }).optional(),
  handler: async (input, agentInfo, { app }) => {
    const tokens = getTokenStore().getToken(agentInfo.id);

    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("google", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Google Authentication")
        .content("Please authenticate with Google to access your tasks")
        .logo("https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png")
        .url(authUrl)
        .provider("google");

      return {
        text: "Authentication required",
        data: undefined,
        ui: oauthUI.build(),
      };
    }

    try {
      const response = await axios.post(
        `https://tasks.googleapis.com/tasks/v1/lists/${input.tasklistId}/tasks`,
        {
          title: input.title,
          notes: input.notes,
          due: input.due,
        },
        {
          params: {
            parent: input.parent,
            previous: input.previous,
          },
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Task Created")
        .content(`
          Title: ${response.data.title}
          Status: ${response.data.status}
          Due: ${response.data.due || 'Not set'}
          Created: ${response.data.updated}
        `)
        .build();

      return {
        text: `Created new task: ${response.data.title}`,
        data: response.data,
        ui: cardUI,
      };
    } catch (error: any) {
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .title("Error")
        .message(error.response?.data?.error?.message || error.message);

      return {
        text: "Failed to create task",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
