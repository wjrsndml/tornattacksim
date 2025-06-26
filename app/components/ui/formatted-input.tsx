"use client";

import type React from "react";
import { forwardRef, useState } from "react";
import {
	cn,
	formatNumber,
	getNumberScale,
	parseFormattedNumber,
} from "../../lib/utils";

export interface FormattedInputProps
	extends Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		"value" | "onChange"
	> {
	value: number;
	onChange: (value: number) => void;
}

const FormattedInput = forwardRef<HTMLInputElement, FormattedInputProps>(
	({ className, value, onChange, onFocus, onBlur, ...props }, ref) => {
		const [isFocused, setIsFocused] = useState(false);
		const [internalValue, setInternalValue] = useState("");

		const displayValue = isFocused ? internalValue : formatNumber(value);
		const scale = getNumberScale(value);

		const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(true);
			setInternalValue(value.toString());
			onFocus?.(e);
		};

		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(false);
			const newValue = parseFormattedNumber(internalValue);
			// 确保值在合理范围内
			const finalValue = Math.max(0, newValue || value);
			onChange(finalValue);
			onBlur?.(e);
		};

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			if (isFocused) {
				setInternalValue(e.target.value);
			}
		};

		return (
			<div className="relative">
				<input
					type="text"
					className={cn(
						"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
						scale && "pr-8", // 如果有量级，增加右边距为量级留空间
						className,
					)}
					value={displayValue}
					onChange={handleChange}
					onFocus={handleFocus}
					onBlur={handleBlur}
					ref={ref}
					{...props}
				/>
				{scale && !isFocused && (
					<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/60 pointer-events-none">
						{scale}
					</span>
				)}
			</div>
		);
	},
);

FormattedInput.displayName = "FormattedInput";

export { FormattedInput };
