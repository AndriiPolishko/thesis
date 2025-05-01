import { useToast, UseToastOptions } from "@chakra-ui/react";

const defaultOptions: Partial<UseToastOptions> = {
  duration: 5000,
  isClosable: true,
  position: "top-right",
};

export function toastHook() {
  const toast = useToast();
  return (options: UseToastOptions) =>
    toast({ ...defaultOptions, ...options });
}