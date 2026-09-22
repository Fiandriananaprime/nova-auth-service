export class NotificationClient {
    constructor(private readonly baseUrl:string){}   

    getBaseUrl() {
        return this.baseUrl;
    }
}