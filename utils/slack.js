import { WebClient } from '@slack/web-api'
import dotenv from 'dotenv';
import fs from "fs";
import axios from "axios";
dotenv.config();

export class Slack {
    constructor(options = {}) {
        this.apiToken = options.slackApiToken;
        this.client = new WebClient(this.apiToken);
        this.pushAlertChannel = 'C065QE1U66Q';
        this.fileUploadUrl = 'https://slack.com/api/files.upload';
    }

    notifySlack = async (channel, options) => {
        return this.client.chat.postMessage({
            channel,
            ...options,
        });
    }

    async notifyAlertChannel (options){
        await this.notifySlack(this.pushAlertChannel, options)
    }

    async uploadFile(path, filename, title) {
        try {
            // Read the file as a buffer
            const fileData = fs.createReadStream(path);
            // console.log(fileData.length, path, filename)

            // Set the request headers
            const headers = {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${this.apiToken}`
            };

            const formData = {
                channels: this.pushAlertChannel,
                filename,
                filetype: 'json',
                file: fileData,
                title
            };

            // Make the API request using Axios
            const response = await axios.post(this.fileUploadUrl, formData, { headers });

            // Check the response for success
            if (response.data.ok) {
                console.log('File uploaded successfully!');
            } else {
                console.error('Error uploading file:', response.data.error);
            }
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }

}
