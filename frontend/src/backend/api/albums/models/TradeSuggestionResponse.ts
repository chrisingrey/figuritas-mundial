export interface TradeSuggestionResponse {
  myName: string;
  theirName: string;
  suggestedExchange: Array<{ mySticker: string; theirSticker: string }>;
  missingLoggedUser: string[];
  missingExchangeUser: string[];
}
