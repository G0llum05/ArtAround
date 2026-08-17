export class VisitService {
    static apiUrl = "http://localhost:8000/api/visit";

    static async getTop10VisitPresentation() {
      try {
        const response = await fetch(`${this.apiUrl}/homePresentation`, {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const data = await response.json();
        return data;
      } catch (error){
        console.error(error);
      }
    }
}
