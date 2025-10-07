import styles from "./profileImage.module.css"

type profileImageProps = {
    src: string;
    alt: string;
    width: string;
}

export function ProfileImage({ src, alt, width }: profileImageProps){

    return (
        <div className={styles.imageDiv} style={{maxWidth: width, width: width}}>
            <img src={src} alt={alt} className={styles.image} />
        </div>
    )
}