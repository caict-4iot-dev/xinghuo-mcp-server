#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

import BIFCoreSDK from 'bifcore-sdk-nodejs'

const sdk = new BIFCoreSDK({
  host: 'http://test.bifcore.bitfactory.cn'
});


/**
 * Create an MCP server with capabilities for resources (to list/read notes),
 * tools (to create new notes), and prompts (to summarize notes).
 */
const server = new Server(
  {
    name: "xinghuo-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_block_number",
        description: "Get current block height",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "get_block_header",
        description: "根据区块高度获取区块头",
        inputSchema: {
          type: "object",
          properties: {
            blockNumber: {
              type: "string",
              description: "区块高度"
            }
          },
          required: ["blockNumber"]
        }
      },
      {
        name: "get_block_transactions",
        description: "获取指定区块的交易列表",
        inputSchema: {
          type: "object",
          properties: {
            blockNumber: {
              type: "string",
              description: "区块高度"
            }
          },
          required: ["blockNumber"]
        }
      },
      {
        name: "get_transaction_info",
        description: "根据交易哈希获取交易详情",
        inputSchema: {
          type: "object",
          properties: {
            hash: {
              type: "string",
              description: "交易哈希"
            }
          },
          required: ["hash"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (request.params.name) {
    case 'get_block_number':
      const height = await sdk.block.getBlockNumber();
      return { result: { height: height.toString() } };

    case 'get_block_header':
      const header = await sdk.block.getBlockLatestInfo({
        blockNumber: args?.blockNumber
      });
      return { result: { header } };

    case 'get_block_transactions':
      const transactions = await sdk.block.getTransactions({
        blockNumber: args?.blockNumber
      });
      return { result: { transactions } };

    case 'get_transaction_info':
      const transaction = await sdk.transaction.getTransactionInfo({
        hash: args?.hash
      });
      return { result: { transaction } };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
