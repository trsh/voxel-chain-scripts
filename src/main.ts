/**
 * Dummy function to demonstrate jest
 */
export function sum(a: number, b: number): number {
  return a + b;
}


/**
 * Main entry point executet by engine
 */
export function main(): void {
  console.log(sum(3, 3));
}

main();
