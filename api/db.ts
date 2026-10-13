export const db = {
  query: async (sql: string, params?: any[]) => {
    console.log("Mock SQL Query:", sql, params);
    return [[], []];
  },
};
