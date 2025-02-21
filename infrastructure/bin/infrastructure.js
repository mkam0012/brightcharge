#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const infrastructure_stack_1 = require("../lib/infrastructure-stack");
const app = new cdk.App();
new infrastructure_stack_1.InfrastructureStack(app, 'BrightChargeDev', {
    environment: 'development',
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'ap-southeast-2',
    },
});
new infrastructure_stack_1.InfrastructureStack(app, 'BrightChargeProd', {
    environment: 'production',
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'ap-southeast-2',
    },
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mcmFzdHJ1Y3R1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmZyYXN0cnVjdHVyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsc0VBQWtFO0FBRWxFLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLElBQUksMENBQW1CLENBQUMsR0FBRyxFQUFFLGlCQUFpQixFQUFFO0lBQzlDLFdBQVcsRUFBRSxhQUFhO0lBQzFCLEdBQUcsRUFBRTtRQUNILE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtRQUN4QyxNQUFNLEVBQUUsZ0JBQWdCO0tBQ3pCO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsSUFBSSwwQ0FBbUIsQ0FBQyxHQUFHLEVBQUUsa0JBQWtCLEVBQUU7SUFDL0MsV0FBVyxFQUFFLFlBQVk7SUFDekIsR0FBRyxFQUFFO1FBQ0gsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO1FBQ3hDLE1BQU0sRUFBRSxnQkFBZ0I7S0FDekI7Q0FDRixDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgSW5mcmFzdHJ1Y3R1cmVTdGFjayB9IGZyb20gJy4uL2xpYi9pbmZyYXN0cnVjdHVyZS1zdGFjayc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbm5ldyBJbmZyYXN0cnVjdHVyZVN0YWNrKGFwcCwgJ0JyaWdodENoYXJnZURldicsIHtcbiAgZW52aXJvbm1lbnQ6ICdkZXZlbG9wbWVudCcsXG4gIGVudjoge1xuICAgIGFjY291bnQ6IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQsXG4gICAgcmVnaW9uOiAnYXAtc291dGhlYXN0LTInLFxuICB9LFxufSk7XG5cbm5ldyBJbmZyYXN0cnVjdHVyZVN0YWNrKGFwcCwgJ0JyaWdodENoYXJnZVByb2QnLCB7XG4gIGVudmlyb25tZW50OiAncHJvZHVjdGlvbicsXG4gIGVudjoge1xuICAgIGFjY291bnQ6IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQsXG4gICAgcmVnaW9uOiAnYXAtc291dGhlYXN0LTInLFxuICB9LFxufSk7XG5cbmFwcC5zeW50aCgpOyJdfQ==