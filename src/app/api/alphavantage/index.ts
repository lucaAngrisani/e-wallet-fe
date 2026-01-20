export class ALPHA_API {
  static readonly BASE_URL = 'https://www.alphavantage.co';
  static readonly QUERY = `${ALPHA_API.BASE_URL}/query?function=:function&symbol=:symbol&interval=5min&apikey=:apikey`;
}
