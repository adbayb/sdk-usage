import { Button as ChakraButton, Link as ChakraLink } from "@chakra-ui/react";
import type { LinkProps as ChakraLinkProps } from "@chakra-ui/react";

export type ButtonProps = {
	children: string;
	test: ChakraLinkProps["isExternal"];
};

const MY_VARIABLE = "test";

export const Button = (props: ButtonProps) => (
	<ChakraLink
		isExternal
		href="https://github.com/vercel/next.js/blob/canary/examples/with-chakra-ui"
		flexGrow={3}
		mx={2}
	>
		<ChakraButton
			width="100%"
			bgGradient="linear(to-tr, teal.300,yellow.400)"
			data-test={MY_VARIABLE}
		>
			{props.children}
		</ChakraButton>
	</ChakraLink>
);
