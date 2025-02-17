import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
  TableUIBuilder,
} from "@dainprotocol/utils";

export const listTasksConfig: ToolConfig = {
  id: "list-tasks",
  name: "List Tasks",
  description: "Returns all tasks in the specified task list",
  input: z.object({
    tasklistId: z.string().describe("Task list identifier"),
    maxResults: z.number().optional().describe("Maximum number of tasks to return (max: 100)"),
    pageToken: z.string().optional().describe("Token for pagination"),
    showCompleted: z.boolean().optional().describe("Include completed tasks"),
    showDeleted: z.boolean().optional().describe("Include deleted tasks"),
    showHidden: z.boolean().optional().describe("Include hidden tasks"),
  }),
  output: z.object({
    items: z.array(z.object({
      id: z.string(),
      title: z.string(),
      updated: z.string(),
      status: z.string().optional(),
      due: z.string().optional(),
    })),
    nextPageToken: z.string().optional(),
  }),
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
        data: { items: [] },
        ui: oauthUI.build(),
      };
    }

    try {
      const response = await axios.get(
        `https://tasks.googleapis.com/tasks/v1/lists/${input.tasklistId}/tasks`,
        {
          params: {
            maxResults: input.maxResults,
            pageToken: input.pageToken,
            showCompleted: input.showCompleted,
            showDeleted: input.showDeleted,
            showHidden: input.showHidden,
          },
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      const tableUI = new TableUIBuilder()
        .addColumns([
          { key: "title", header: "Title", type: "text" },
          { key: "status", header: "Status", type: "text" },
          { key: "due", header: "Due Date", type: "text" },
          { key: "updated", header: "Last Updated", type: "text" },
        ])
        .rows(response.data.items || [])
        .build();

      return {
        text: `Found ${response.data.items?.length || 0} tasks`,
        data: {
          items: response.data.items || [],
          nextPageToken: response.data.nextPageToken,
        },
        ui: tableUI,
      };
    } catch (error: any) {
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .title("Error")
        .message(error.response?.data?.error?.message || error.message);

      return {
        text: "Failed to fetch tasks",
        data: { items: [] },
        ui: alertUI.build(),
      };
    }
  },
};
