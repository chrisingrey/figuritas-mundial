export interface IVerificationService<TCreateArgs, TVerifyArgs, TCreateResult = void> {
  create(args: TCreateArgs): Promise<TCreateResult>;
  verify(args: TVerifyArgs): Promise<void>;
}
