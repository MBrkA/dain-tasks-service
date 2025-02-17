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

export const listTaskListsConfig: ToolConfig = {
  id: "list-tasklists",
  name: "List Task Lists",
  description: "Returns all the authenticated user's task lists",
  input: z.object({
    maxResults: z.number().optional().describe("Maximum number of task lists to return (max: 100)"),
    pageToken: z.string().optional().describe("Token for pagination"),
  }),
  output: z.object({
    items: z.array(z.object({
      id: z.string(),
      title: z.string(),
      updated: z.string(),
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
        data: [],
        ui: oauthUI.build(),
      };
    }

    try {
      const response = await axios.get(
        `https://tasks.googleapis.com/tasks/v1/users/@me/lists`,
        {
          params: {
            maxResults: input.maxResults,
            pageToken: input.pageToken,
          },
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      const tableUI = new TableUIBuilder()
        .addColumns([
          { key: "title", header: "Title", type: "text" },
          { key: "id", header: "ID", type: "text" },
          { key: "updated", header: "Last Updated", type: "text" },
        ])
        .rows(response.data.items || [])
        .build();

      return {
        text: `Found ${response.data.items?.length || 0} task lists`,
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
        text: "Failed to fetch task lists",
        data: { items: [] },
        ui: alertUI.build(),
      };
    }
  },
};
