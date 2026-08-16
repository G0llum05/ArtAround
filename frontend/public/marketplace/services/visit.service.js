export class VisitService {
  static apiUrl = "http://localhost:8000/api/visit";

    static async getAllHomePresentationVisits() {
      try {
        const response = await fetch(this.apiUrl, {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error(response.statusText);
        }
      } catch (error){
        console.error(error);
      }
    }
}
