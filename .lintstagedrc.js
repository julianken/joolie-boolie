export default {
  '*': () => [
    // Only run on changed packages using Turbo filtering
    'turbo run lint --filter=[HEAD^1]',
    'turbo run typecheck --filter=[HEAD^1]',
    'turbo run test:run --filter=[HEAD^1]',
  ],
}
