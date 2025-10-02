import { TransactionService } from "../pages/transaction/transaction.service";

export const initEvaluatePlan = async (transactionService: TransactionService) => {
  const doEvaluatePlan = () => {
    transactionService.evaluatePlans();
  };

  doEvaluatePlan();

  setInterval(() => {
    doEvaluatePlan();
  }, 300000);
};
