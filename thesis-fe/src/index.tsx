import { ChakraProvider } from "@chakra-ui/react";
import { render } from "react-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { App } from "./App";

const queryClient = new QueryClient();

render(
<QueryClientProvider client={queryClient}> 
  <ChakraProvider>
    <App />
  </ChakraProvider>
</QueryClientProvider>, 
document.getElementById("root"));