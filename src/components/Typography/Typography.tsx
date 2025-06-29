import React from "react";
import classnames from "classnames";

export type TAs = "h1" | "h2" | "h3" | "span" | "p";

export type TWeight = "light" | "regular" | "semibold" | "bold";

export type TVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "subtitle1"
  | "subtitle2"
  | "body1"
  | "body2"
  | "button"
  | "caption"
  | "overline"
  | "subtitle1Bold";

export interface ITextProps {
  as?: TAs;
  children: React.ReactNode;
  size?: string;
  weight?: TWeight;
  className?: string;
  wrap?: boolean;
  lora?: boolean;
  variant?: TVariant;
}

export interface WeightItem {
  light: string;
  regular: string;
  semibold: string;
  bold: string;
}

const weights: WeightItem = {
  light: "font-light",
  regular: "font-normal",
  semibold: "font-semibold",
  bold: "font-bold",
};

// Tailwind classes for each variant, based on the image
const variantStyles: Record<TVariant, string> = {
  h1: "text-[96px] leading-[104px] tracking-[-1.5px] font-semibold", // -1.5/16 = -0.094em
  h2: "text-[60px] leading-[64px] tracking-[-0.5px] font-semibold", // -0.5/16 = -0.031em
  h3: "text-[48px] leading-[56px] tracking-normal font-semibold",
  h4: "text-[34px] leading-[40px] tracking-[0.25px] font-semibold", // 0.25/16 = 0.015em
  h5: "text-[24px] leading-[32px] tracking-normal font-semibold",
  h6: "text-[20px] leading-[24px] tracking-[0.15px] font-semibold", // 0.15/16 = 0.009em
  subtitle1: "text-[16px] leading-[24px] tracking-[0.15px] font-normal", // 0.15/16 = 0.009em
  subtitle1Bold: "text-[16px] leading-[24px] tracking-[0.15px] font-semibold", // 0.15/16 = 0.009em
  subtitle2: "text-[14px] leading-[24px] tracking-[0.1px] font-semibold", // 0.1/16 = 0.006em
  body1: "text-[16px] leading-[24px] tracking-[0. 5px] font-normal", // 0.5/16 = 0.031em
  body2: "text-[14px] leading-[24px] tracking-[0.25px] font-normal", // 0.25/16 = 0.018em
  button:
    "text-[14px] leading-[24px] tracking-[0.125px] font-semibold uppercase", // 1.25/16 = 0.078em
  caption: "text-[12px] leading-[16px] tracking-[0.033em] font-normal", // 0.4/12 = 0.033em
  overline:
    "text-[10px] leading-[16px] tracking-[0.15px] font-normal uppercase", // 1.5/10 = 0.15em
};

export function Text({
  as,
  size,
  children,
  className,
  wrap = true,
  lora = false,
  weight = "regular",
  variant,
}: ITextProps) {
  const CustomTag = `${as ?? "span"}` as keyof React.JSX.IntrinsicElements;
  const hasTextColor = className?.includes("text-");

  return (
    <CustomTag
      className={classnames(
        variant ? variantStyles[variant] : size ? undefined : "text-base",
        size && !variant ? `text-${size}` : undefined,
        !variant && weights[weight],
        lora ? "font-lora" : "font-cabin",
        wrap ? "text-wrap break-keep" : "break-keep",
        !hasTextColor && "text-dark-secondary",
        className,
      )}
    >
      {children}
    </CustomTag>
  );
}

function LightText({ ...props }: ITextProps) {
  return <Text {...props} weight="light" />;
}

function RegularText({ ...props }: ITextProps) {
  return <Text {...props} weight="regular" />;
}

function SemiboldText({ ...props }: ITextProps) {
  return <Text {...props} weight="semibold" />;
}

function BoldText({ ...props }: ITextProps) {
  return <Text {...props} weight="bold" />;
}

export type TTitleClass = "dialog" | "form";

export interface ITitleTextProps extends ITextProps {
  for: TTitleClass;
}

function TitleText({ children, ...props }: ITitleTextProps) {
  return <Text {...props}>{children}</Text>;
}

Text.Light = LightText;
Text.Regular = RegularText;
Text.Semibold = SemiboldText;
Text.Bold = BoldText;
Text.Title = TitleText;

export default Text;
