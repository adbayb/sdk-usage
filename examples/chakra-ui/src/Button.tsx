// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
	Button,
	ButtonProps,
	Link as ChakraLink,
	type ChakraLinkProps,
} from "@chakra-ui/react";

export interface ButtonProps {
	children: string;
	test: ChakraLinkProps["plop"];
}

export const Button = (props: ButtonProps) => (
	<ChakraLink
		isExternal
		href="https://github.com/vercel/next.js/blob/canary/examples/with-chakra-ui"
		flexGrow={3}
		mx={2}
	>
		<Button
			width="100%"
			bgGradient="linear(to-tr, teal.300,yellow.400)"
			testVariable={myVariable}
		>
			{props.children}
		</Button>
	</ChakraLink>
);
