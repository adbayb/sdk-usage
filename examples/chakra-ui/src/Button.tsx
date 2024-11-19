import { Button as ChakraButton, Link as ChakraLink } from "@chakra-ui/react";
import type { LinkProps as ChakraLinkProps } from "@chakra-ui/react";

export type ButtonProps = {
	readonly children: string;
	readonly test: ChakraLinkProps["isExternal"];
};

const MY_VARIABLE = "test";

export const Button = ({ children }: ButtonProps) => (
	<ChakraLink
		flexGrow={3}
		href="https://github.com/vercel/next.js/blob/canary/examples/with-chakra-ui"
		isExternal
		mx={2}
	>
		<ChakraButton
			bgGradient="linear(to-tr, teal.300,yellow.400)"
			data-test={MY_VARIABLE}
			width="100%"
		>
			{children}
		</ChakraButton>
	</ChakraLink>
);
