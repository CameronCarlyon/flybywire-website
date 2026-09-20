import { ReactNode } from 'react';
import Section from '../Utils/Section';
import Container from '../Utils/Container';
import Button from '../Button/Button';

interface ButtonConfig {
    label: string;
    theme: 'primary' | 'secondary' | 'positive' | 'caution' | 'danger' | 'discord';
    link?: string;
    target?: '_blank' | '_parent' | '_self' | '_top';
    rel?: string;
}

interface DownloadSectionProps {
    heading?: string;
    description: string;
    buttons?: ButtonConfig[];
}

const ButtonGroup = (props: { children: ReactNode }) => (
    <ul className="flex flex-col md:flex-row gap-4 justify-center mt-2 items-center">
        {props.children}
    </ul>
);

const DownloadSectionComponent = ({
    heading,
    description,
    buttons,
}: DownloadSectionProps) => {
    const defaultButtons: ButtonConfig[] = [
        { label: 'Direct Downloads', theme: 'secondary' },
        { label: 'Download Installer', theme: 'primary', link: '/community' },
        { label: 'Installation Guide', theme: 'secondary' },
    ];

    const buttonsToRender = buttons ?? defaultButtons;

    return (
        <Section className="relative flex flex-col justify-center !py-32">
            <Container className="text-center justify-center gap-10">
                {heading && (
                    <div className="flex flex-col items-center gap-4">
                        <h2 className="font-bold text-secondary">{heading}</h2>
                        <span
                            className="block h-1 w-16 rounded-full"
                            style={{ background: 'linear-gradient(90deg, var(--color-brand-cyan-dark), var(--color-brand-cyan-main))' }}
                            aria-hidden="true"
                        />
                    </div>
                )}
                <p className="max-w-xl mx-auto text-center text-black/70">{description}</p>
                <ButtonGroup>
                    {buttonsToRender.map((button, index) => (
                        <Button
                            key={index}
                            theme={button.theme}
                            link={button.link}
                            target={button.target}
                            rel={button.rel}
                        >
                            {button.label}
                        </Button>
                    ))}
                </ButtonGroup>
            </Container>
        </Section>
    );
};

export default DownloadSectionComponent;
